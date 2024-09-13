import { NextFunction, Request, Response } from 'express';
import { HttpException } from '@/exceptions/HttpException';
import { passport } from '@/config/passport';
import { Container } from 'typedi';
import { AdminService } from '@/services/admin.service';
import { Admin } from '@prisma/client';
import { IDataTable, IFindAllPaginateOptions } from '@/interfaces/datatable.interface';
import { IUpdateAction, TSortType } from '@/interfaces/global.interface';

/**
 * Controller handling admin-related HTTP requests.
 */
export class AdminController {
  // Initialize the AdminService via dependency injection
  public admin = Container.get(AdminService);

  /**
   * @description Handles admin login functionality using Passport's local strategy.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next function to pass control to the next middleware.
   * @returns A JSON response with a success message and admin data or an error.
   */
  public login = async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('admin-local', (e: Error, admin: Admin) => {
      if (e || !admin) {
        return next(new HttpException(401, 'Invalid credentials'));
      }
      req.login(admin, loginErr => {
        if (loginErr) {
          return next(new HttpException(500, 'Login failed'));
        }
        return res.status(200).json({ message: 'Logged in successfully', data: admin });
      });
    })(req, res, next);
  };

  /**
   * @description Logs out the currently authenticated admin and clears the session cookie.
   * @param req - Express request object.
   * @param res - Express response object.
   * @returns A JSON response indicating successful logout or an error message.
   */
  public logout = async (req: Request, res: Response) => {
    req.logout(e => {
      if (e) {
        return res.status(500).json({ message: 'Error during logout' });
      }
      res.clearCookie('connect.sid'); // Clear session cookie
      return res.status(200).json({ message: 'Logged out successfully' });
    });
  };

  /**
   * @description Retrieves the profile of the currently authenticated admin.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next function to pass control to the next middleware.
   * @returns A JSON response with the admins profile data or an error message.
   */
  public getProfile = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new HttpException(401, 'Not authenticated'));
    }
    return res.status(200).json({ message: 'User Profile', data: req.user });
  };

  /**
   * @description Updates the profile details of the currently authenticated admin.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next function to pass control to the next middleware.
   * @returns A JSON response with the updated admin data or an error message.
   */
  public updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email } = req.body;
      const adminId = (req.user as Admin).id; // Extract the admins ID from req.user

      const updatedAdmin = await this.admin.updateProfile(adminId, name, email);

      res.status(200).json({ message: 'Profile updated successfully', data: updatedAdmin });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @description Updates the password of the currently authenticated admin.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next function to pass control to the next middleware.
   * @returns A JSON response indicating successful password update or an error message.
   */
  public updatePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const adminId = (req.user as Admin).id; // Extract the admins ID from req.user

      await this.admin.updatePassword(adminId, currentPassword, newPassword);

      res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
      next(error); // Pass any errors to the error handling middleware
    }
  };

  /**
   * Retrieves a paginated list of users based on query parameters.
   * Supports pagination, filtering, sorting, and search.
   * @method get
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function for error handling
   */
  public getUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Destructure query parameters with default values
      const { pageNumber = 0, perPage = 10, sort = 'createdAt', order = 'ASC', ...filters } = req.query;

      // Prepare options for pagination and filtering
      const options: IFindAllPaginateOptions = {
        pageNumber: Number(pageNumber) + 1,
        perPage: Number(perPage),
        filters: filters,
        q: req.query.q as string,
        ignoreGlobal: (req.query.ignoreGlobal as string)?.split(',') || [],
        sort: String(sort),
        order: String(order).toUpperCase() as TSortType,
      };

      // Fetch paginated user data
      const findAllUsersData: IDataTable<Admin> = await this.admin.findAllPaginate(options);
      // Respond with the fetched data
      res.status(200).json({ data: findAllUsersData, message: 'findAll' });
    } catch (error) {
      // Pass any errors to the next error handling middleware
      next(error);
    }
  };

  /**
   * Retrieves a single user by their ID.
   * @method get
   * @param req Express request object with user ID in params
   * @param res Express response object
   * @param next Express next function for error handling
   */
  public getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId: string = req.params.id;
      // Find user by ID
      const findOneUserData: Admin = await this.admin.findById(userId);

      // Respond with the fetched user data
      res.status(200).json({ data: findOneUserData, message: 'findOne' });
    } catch (error) {
      // Pass any errors to the next error handling middleware
      next(error);
    }
  };

  /**
   * Creates a new user with provided data.
   * @method post
   * @param req Express request object with user data in body
   * @param res Express response object
   * @param next Express next function for error handling
   */
  public createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userData: Admin = req.body;
      // Create new user
      const createUserData: Admin = await this.admin.create(userData);

      // Respond with the created user data
      res.status(201).json({ data: createUserData, message: 'created' });
    } catch (error) {
      // Pass any errors to the next error handling middleware
      next(error);
    }
  };

  /**
   * Updates an existing user with provided data.
   * @method put
   * @param req Express request object with user ID in params and user data in body
   * @param res Express response object
   * @param next Express next function for error handling
   */
  public updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId: string = req.params.id;
      const userData: Admin = req.body;
      // Update user by ID
      const updateUserData: Admin = await this.admin.update(userId, userData);

      // Respond with the updated user data
      res.status(200).json({ data: updateUserData, message: 'updated' });
    } catch (error) {
      // Pass any errors to the next error handling middleware
      next(error);
    }
  };

  /**
   * Deletes a user by their ID.
   * @method delete
   * @param req Express request object with user ID in params
   * @param res Express response object
   * @param next Express next function for error handling
   */
  public deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userIds: string[] = req.body.ids;
      // Delete user by ID
      await this.admin.delete(userIds);

      // Respond with success message
      res.status(200).json({ message: 'deleted' });
    } catch (error) {
      // Pass any errors to the next error handling middleware
      next(error);
    }
  };

  /**
   * Single action a users by their ID & Type.
   * @method post
   * @param req Express request object with user ID in params
   * @param res Express response object
   * @param next Express next function for error handling
   */
  public updateAction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ids, field }: IUpdateAction = req.body;

      await this.admin.updateAction({ ids, field });

      // Respond with success message
      res.status(200).json({ message: 'Updated Bulk Action' });
    } catch (error) {
      // Pass any errors to the next error handling middleware
      next(error);
    }
  };
}
